"use client";

import { useState, useEffect } from "react";
import { useUserInteraction } from "../context/UserInteractionProvider";
import apiClient from "@/lib/api";

export default function DirectMessageModal() {
    const { dmModal, closeDmModal, showAlert } = useUserInteraction();
    const { show, targetUser, context } = dmModal;

    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (show) {
            setContent("");
        }
    }, [show]);

    const handleSendMessage = async () => {
        if (!content.trim() || !targetUser) return;
        setIsSending(true);

        const isAnonymousTarget = targetUser.displayName?.startsWith('익명');

        const payload = {
            recipientId: targetUser.id,
            content: content.trim(),
            sourcePostTitle: context?.type === 'post' ? context.title : context?.type === 'meeting' ? context.title : undefined,
            isRecipientAnonymous: isAnonymousTarget,
        };

        try {
            await apiClient.post('/messages', payload);
            showAlert("쪽지를 성공적으로 보냈습니다.");
            closeDmModal();
        } catch (error) {
            console.error("쪽지 전송 오류:", error);
            showAlert("쪽지 전송에 실패했습니다.");
        } finally {
            setIsSending(false);
        }
    };

    if (!show) return null;

    return (
        <div 
            className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={closeDmModal}
        >
            <style>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleUp {
                    animation: scaleUp 0.2s ease-out forwards;
                }
            `}</style>
            
            <div 
                className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                            <i className="fas fa-paper-plane text-sm"></i>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 font-bold uppercase tracking-wider">TO</span>
                            <h3 className="text-lg font-bold text-gray-900 leading-none">
                                {targetUser?.displayName || targetUser?.nickname}
                            </h3>
                        </div>
                    </div>
                    <button 
                        onClick={closeDmModal} 
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center transition"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6">
                    {context?.title && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 flex items-center gap-2">
                            <i className="fas fa-quote-left text-gray-300"></i>
                            <span className="font-medium truncate">관련글: {context.title}</span>
                        </div>
                    )}
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="정중하고 배려하는 마음으로 쪽지를 작성해주세요."
                        className="w-full h-40 p-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none text-sm leading-relaxed transition-all"
                        autoFocus
                    />
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <button 
                        onClick={closeDmModal} 
                        className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleSendMessage} 
                        disabled={isSending} 
                        className="flex-[2] py-3.5 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>전송 중...</span>
                            </>
                        ) : (
                            <>
                                <span>쪽지 보내기</span>
                                <i className="fas fa-paper-plane"></i>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};