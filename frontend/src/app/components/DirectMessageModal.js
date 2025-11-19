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
        <div className="modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
            <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">{targetUser?.displayName || targetUser?.nickname}님에게 쪽지 보내기</h3>
                    <button onClick={closeDmModal} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <div className="p-4">
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="보낼 내용을 입력하세요..."
                        className="w-full h-32 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end p-4 border-t bg-gray-50">
                    <button onClick={closeDmModal} className="px-4 py-2 border rounded-md mr-2">취소</button>
                    <button onClick={handleSendMessage} disabled={isSending} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400">
                        {isSending ? "전송 중..." : "보내기"}
                    </button>
                </div>
            </div>
        </div>
    );
};

