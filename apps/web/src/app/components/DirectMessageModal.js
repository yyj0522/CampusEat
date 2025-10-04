"use client";

import { useState, useEffect } from "react";
import { useUserInteraction } from "../context/UserInteractionProvider";
import { useAuth } from "../context/AuthProvider";
import { db } from "../../firebase";
import { addDoc, collection, serverTimestamp, getDoc, doc } from "firebase/firestore";

function AlertModal({ message, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70]">
      <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm">
        <p className="text-lg mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-8 py-2 rounded-lg w-full"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function DirectMessageModal() {
    const { showDmModal, setShowDmModal, dmTarget } = useUserInteraction();
    const { user } = useAuth();
    const [content, setContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [senderNickname, setSenderNickname] = useState("");
    const [alert, setAlert] = useState({ show: false, message: "" });

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
            setAlert({ show: true, message: "쪽지를 성공적으로 보냈습니다." });
        } catch (error) {
            console.error("쪽지 전송 오류:", error);
            setAlert({ show: true, message: "쪽지 전송 중 오류가 발생했습니다." });
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setContent("");
        setShowDmModal(false);
    };

    const handleAlertClose = () => {
        if (alert.message.includes("성공")) {
            handleClose();
        }
        setAlert({ show: false, message: "" });
    };

    if (!showDmModal) return null;

    return (
        <>
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
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
            {alert.show && <AlertModal message={alert.message} onClose={handleAlertClose} />}
        </>
    );
}