"use client";

import { useState, useEffect } from "react";
import { useUserInteraction } from "../context/UserInteractionProvider";
import { useAuth } from "../context/AuthProvider";
import { db } from "../../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// 이 파일 내에서만 사용할 알림 모달
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
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
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


export default function ReportModal() {
    const { showReportModal, setShowReportModal, contextMenu } = useUserInteraction();
    const { user } = useAuth();
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            setAlert({ show: true, message: "신고 사유를 선택해주세요." });
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            await addDoc(collection(db, "reports"), {
                reporterId: user.uid,
                reportedUserId: contextMenu.targetUser.id,
                reportedUserNickname: contextMenu.targetUser.nickname,
                reason,
                details,
                contextType: contextMenu.context?.type,
                contextId: contextMenu.context?.id,     
                createdAt: serverTimestamp(),
                status: "pending",
            });
            setAlert({ show: true, message: "신고가 접수되었습니다. 신속하게 처리하겠습니다." });
        } catch (error) {
            console.error("신고 접수 오류:", error);
            setAlert({ show: true, message: "신고 접수 중 오류가 발생했습니다." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setReason("");
        setDetails("");
        setShowReportModal(false);
    };

    const handleAlertClose = () => {
        // 성공 메시지 확인 후에는 신고창을 닫음
        if (alert.message.includes("접수")) {
            handleClose();
        }
        setAlert({ show: false, message: "" });
    };

    if (!showReportModal) return null;

    return (
        <>
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="modal-content bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
                    <h3 className="text-xl font-bold mb-4">사용자 신고하기</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        <span className="font-semibold">{contextMenu.targetUser?.nickname}</span>님을 신고하는 이유를 선택해주세요.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <select 
                                value={reason} 
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="">-- 사유 선택 --</option>
                                <option value="spam">광고/스팸</option>
                                <option value="abuse">욕설/비방</option>
                                <option value="inappropriate">부적절한 콘텐츠</option>
                                <option value="other">기타</option>
                            </select>
                        </div>
                        <div>
                            <textarea 
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows="4"
                                placeholder="상세한 내용을 입력해주시면 처리에 도움이 됩니다."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={handleClose} disabled={isSubmitting} className="px-4 py-2 border rounded-lg hover:bg-gray-50">취소</button>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">{isSubmitting ? "접수 중..." : "신고 접수"}</button>
                        </div>
                    </form>
                </div>
            </div>
            {alert.show && <AlertModal message={alert.message} onClose={handleAlertClose} />}
        </>
    );
}