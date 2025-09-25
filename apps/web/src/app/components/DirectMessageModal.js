"use client";

import { useState, useEffect } from "react";
import { useUserInteraction } from "../context/UserInteractionProvider";
import { useAuth } from "../context/AuthProvider";
import { db } from "../../firebase";
import { addDoc, collection, serverTimestamp, getDoc, doc } from "firebase/firestore";

export default function DirectMessageModal() {
    const { showDmModal, setShowDmModal, dmTarget } = useUserInteraction(); // dmTarget 사용
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [senderNickname, setSenderNickname] = useState("");

    useEffect(() => {
        const fetchNickname = async () => {
            if(user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if(userDoc.exists()) {
                    setSenderNickname(userDoc.data().nickname);
                }
            }
        };
        fetchNickname();
    }, [user]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!content.trim() || !dmTarget) return;
        if (isSending) return;
        setIsSending(true);

        try {
            await addDoc(collection(db, "messages"), {
                senderId: user.uid,
                senderNickname: senderNickname,
                recipientId: dmTarget.id,
                recipientNickname: dmTarget.nickname,
                content: content.trim(),
                createdAt: serverTimestamp(),
                isRead: false,
            });
            alert("쪽지를 성공적으로 보냈습니다."); // 이 부분은 나중에 AlertModal로 교체 가능
            handleClose();
        } catch (error) {
            console.error("쪽지 전송 오류:", error);
            alert("쪽지 전송 중 오류가 발생했습니다.");
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setContent("");
        setShowDmModal(false);
    };

    if (!showDmModal) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">쪽지 보내기</h3>
                <p className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold">{dmTarget?.nickname}</span>님에게 쪽지를 보냅니다.
                </p>
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="6"
                            placeholder="쪽지 내용을 입력하세요..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            autoFocus
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={handleClose} disabled={isSending} className="px-4 py-2 border rounded-lg hover:bg-gray-50">취소</button>
                        <button type="submit" disabled={isSending} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isSending ? "전송 중..." : "보내기"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}